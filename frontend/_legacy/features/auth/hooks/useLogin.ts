import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMe, loginUser, type LoginInput } from "@/api/auth";
import { ApiError } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/stores/auth.store";

interface LoginSuccess {
  token: string;
  user: Awaited<ReturnType<typeof getMe>>;
}

export function useLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation<LoginSuccess, Error, LoginInput>({
    mutationFn: async (data) => {
      const tokenResponse = await loginUser(data);
      const user = await getMe(tokenResponse.access_token);
      return {
        token: tokenResponse.access_token,
        user,
      };
    },
    onSuccess: ({ token, user }) => {
      setAuth(user, token);
      const redirect = searchParams.get("redirect");
      navigate(redirect && redirect.length > 0 ? redirect : "/", { replace: true });
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : "Sign in failed. Please try again.";
      toast({
        title: "Unable to sign in",
        description: message,
        variant: "destructive",
      });
    },
  });
}
