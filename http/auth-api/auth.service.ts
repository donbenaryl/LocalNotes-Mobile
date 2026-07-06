import { PublicHttpService } from "..";
import type{ signUpDTO, signInDTO, signInDAO, resetDTO, resetDAO, verifyDTO } from "./types";

class SignUpService extends PublicHttpService{
    constructor() {
    super({
      baseURL: "/accounts",
    });
  }
    async SignUp(dto: signUpDTO) {
    return await this.SendRequest({
      method: "post",
      path: "/register",
      body: dto,
    });
    

  }
  async SignIn(dto: signInDTO) {
    return await this.SendRequest<signInDAO>({
      method: "post",
      path: "/login",
      body: dto,
    });
  }
  async SignInWithGoogle(dto: {id_token:string}) {
    return await this.SendRequest<signInDAO>({
      method: "post",
      path: "/social-auth/google",
      body: dto,
    });
  }
  async ForgotPassword(dto:{email:string}) {
    return await this.SendRequest<resetDAO>({
      method: "post",
      path: "/password-reset",
      body: dto,
    });
  }
  async resentOtp(dto:{email:string}) {
    return await this.SendRequest<resetDAO>({
      method: "post",
      path: "/resend-otp",
      body: dto,
    });
  }
  async ResetPassword(dto: resetDTO) {
  return await this.SendRequest<resetDAO>({
    method: "post",
    path: "/password-reset/confirm",
    body: dto,
  }); }
  async VerifyEmail(dto: verifyDTO) {
  return await this.SendRequest({
    method: "post",
    path: "/password-reset/verify-otp",
    body: dto,
  });
}
  async VerifyRegistrationEmail(dto: verifyDTO) {
  return await this.SendRequest<signInDAO>({
    method: "post",
    path: "/verify-registration",
    body: dto,
  });
}
}

export default new SignUpService()