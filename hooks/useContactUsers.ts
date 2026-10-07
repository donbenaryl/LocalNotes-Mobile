import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Contacts from "expo-contacts";
import * as Crypto from "expo-crypto";
import type { CountryCode } from "libphonenumber-js";
import accountService from "@/http/account-api/account.services";
import type { ContactMatchPersonDAO } from "@/http/account-api/types";
import { getDeviceRegion, getRegionFromE164, toE164 } from "@/utils/phone";

/** Mirrors the backend's per-request cap on POST /accounts/contacts/match. */
const MATCH_CHUNK_SIZE = 1000;

export type ContactsPermissionState = "pending" | "granted" | "denied";

export type ContactUser = ContactMatchPersonDAO & {
  /** Name as saved in the device address book. */
  contactName?: string;
};

async function readContactNumbers(
  defaultRegion: CountryCode | undefined,
): Promise<Map<string, string | undefined>> {
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
  });
  const byE164 = new Map<string, string | undefined>();
  for (const contact of data) {
    for (const phone of contact.phoneNumbers ?? []) {
      const raw = phone.number ?? phone.digits;
      if (!raw) continue;
      const region =
        (phone.countryCode?.toUpperCase() as CountryCode | undefined) ?? defaultRegion;
      const e164 = toE164(raw, region);
      if (e164 && !byE164.has(e164)) byE164.set(e164, contact.name || undefined);
    }
  }
  return byE164;
}

async function hashNumbers(numbers: string[]): Promise<Map<string, string>> {
  const entries = await Promise.all(
    numbers.map(async (e164) => {
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        e164,
        { encoding: Crypto.CryptoEncoding.HEX },
      );
      return [digest.toLowerCase(), e164] as const;
    }),
  );
  return new Map(entries);
}

/**
 * Requests contacts access, hashes every number (E.164 → SHA-256) on-device and
 * returns LocalNotes members whose verified phone matches.
 */
export function useContactUsers(ownPhone?: string | null) {
  const [permission, setPermission] = useState<ContactsPermissionState>("pending");
  const [canAskAgain, setCanAskAgain] = useState(true);

  const requestPermission = useCallback(async () => {
    try {
      const response = await Contacts.requestPermissionsAsync();
      setCanAskAgain(response.canAskAgain);
      setPermission(response.granted ? "granted" : "denied");
    } catch {
      setCanAskAgain(false);
      setPermission("denied");
    }
  }, []);

  useEffect(() => {
    void requestPermission();
  }, [requestPermission]);

  const defaultRegion = getRegionFromE164(ownPhone) ?? getDeviceRegion();

  const query = useQuery({
    queryKey: ["contactUsers", defaultRegion ?? null],
    enabled: permission === "granted",
    retry: false,
    queryFn: async (): Promise<ContactUser[]> => {
      const byE164 = await readContactNumbers(defaultRegion);
      if (byE164.size === 0) return [];

      const hashToE164 = await hashNumbers([...byE164.keys()]);
      const hashes = [...hashToE164.keys()];
      const matches: ContactUser[] = [];
      const seen = new Set<string>();

      for (let i = 0; i < hashes.length; i += MATCH_CHUNK_SIZE) {
        const response = await accountService.matchContacts({
          hashes: hashes.slice(i, i + MATCH_CHUNK_SIZE),
        });
        if (response.error) {
          throw new Error(response.error.message);
        }
        for (const user of response.data?.data ?? []) {
          if (seen.has(user.id)) continue;
          seen.add(user.id);
          const e164 = hashToE164.get(user.matched_hash);
          matches.push({ ...user, contactName: e164 ? byE164.get(e164) : undefined });
        }
      }
      return matches;
    },
  });

  return {
    users: query.data ?? [],
    isLoading: permission === "pending" || (permission === "granted" && query.isLoading),
    error: query.error,
    permission,
    canAskAgain,
    requestPermission,
    refetch: query.refetch,
  };
}
