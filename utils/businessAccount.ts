export function isBusinessAccountType(accountType: string | undefined): boolean {
  return accountType?.toLowerCase() === 'business';
}
