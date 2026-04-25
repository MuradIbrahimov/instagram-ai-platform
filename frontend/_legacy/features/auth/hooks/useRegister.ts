import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getMe, loginUser, registerUser, type LoginInput, type RegisterInput } from "@/api/auth";
import { ApiError } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/stores/auth.store";

interface RegisterFlowInput extends RegisterInput {
  confirmPassword?: string;
}

interface RegisterSuccess {
  token: string;
  user: Awaited<ReturnType<typeof getMe>>;
}

export function useRegister() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation<RegisterSuccess, Error, RegisterFlowInput>({
    mutationFn: async (data) => {
      const registrationPayload: RegisterInput = {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      };

      await registerUser(registrationPayload);

      const loginPayload: LoginInput = {
        email: data.email,
        password: data.password,
      };
      const tokenResponse = await loginUser(loginPayload);
      const user = await getMe(tokenResponse.access_token);

      return {
        token: tokenResponse.access_token,
        user,
      };
    },
    onSuccess: ({ token, user }) => {
      setAuth(user, token);
      navigate("/workspaces/new", { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "email_taken") {
        toast({
          title: "Registration failed",
          description: "This email is already registered",
          variant: "destructive",
        });
        return;
      }

      const message = error instanceof ApiError ? error.message : "Could not create your account.";
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    },
  });
}
