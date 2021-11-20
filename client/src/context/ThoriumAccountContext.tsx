import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {useLocalStorage} from "../hooks/useLocalStorage";

type ThoriumAccountContextProps = {
  account: ThoriumAccount;
  login: () => void;
  logout: () => void;
  userCode?: string;
  verificationUrl?: string;
  verifying: boolean;
};
interface ThoriumAccount {
  id: number;
  displayName: string;
  profilePictureUrl: string;
  githubConnection: boolean;
  access_token: string;
}
const ThoriumAccountContext = createContext<ThoriumAccountContextProps>(null!);

export function ThoriumAccountContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [account, setAccount] = useLocalStorage<ThoriumAccount | null>(
    "thorium_account",
    null
  );
  const [verifying, setVerifying] = useState(false);
  const [deviceCode, setDeviceCode] = useState<{
    device_code: string;
    user_code: string;
    expires_in: number;
    interval: number;
    verification_uri: string;
  } | null>(null);

  const value = useMemo(() => {
    function logout() {
      setDeviceCode(null);
      setAccount(null);
    }
    async function login() {
      setVerifying(true);
      // Kick off the login process
      const data = await fetch(
        `${process.env.THORIUMSIM_URL}/oauth/device_request`,
        {
          method: "POST",
          body: JSON.stringify({
            client_id: process.env.THORIUMSIM_CLIENT_ID,
            scope: "identity github:issues",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).then(res => res.json());
      if (data.error) {
        setVerifying(false);
        throw new Error(data.error_description);
      }

      setDeviceCode(data);
    }
    return {
      account,
      login,
      logout,
      userCode: deviceCode?.user_code,
      verificationUrl: deviceCode?.verification_uri,
      verifying,
    };
  }, [account, setAccount, deviceCode, verifying]);

  useEffect(() => {
    if (deviceCode) {
      const interval = setInterval(async () => {
        const data = await fetch(
          `${process.env.THORIUMSIM_URL}/oauth/access_token`,
          {
            method: "POST",
            body: JSON.stringify({
              client_id: process.env.THORIUMSIM_CLIENT_ID,
              device_code: deviceCode.device_code,
              grant_type: "device_code",
            }),
            headers: {
              "Content-Type": "application/json",
            },
          }
        ).then(res => res.json());

        if (data.error) {
          if (data.error === "authorization_pending") return;
          if (data.error === "slow_down") {
            setDeviceCode({...deviceCode, interval: deviceCode.interval * 2});
            return;
          }
          if (data.error === "expired_token") {
            setDeviceCode(null);
            value.login();
            clearInterval(interval);
            return;
          }
          setVerifying(false);
          setDeviceCode(null);
        }

        if (data.access_token) {
          setVerifying(false);
          clearInterval(interval);
          const user = await fetch(
            `${process.env.THORIUMSIM_URL}/api/identity`,
            {
              headers: {
                Authorization: `Bearer ${data.access_token}`,
              },
              credentials: "omit",
            }
          ).then(res => res.json());
          setAccount({...data, ...user});
          setDeviceCode(null);
        }
      }, deviceCode.interval * 1000);

      return () => clearInterval(interval);
    }
  }, [deviceCode, setAccount, value]);

  return (
    <ThoriumAccountContext.Provider value={value}>
      {children}
    </ThoriumAccountContext.Provider>
  );
}

export function useThoriumAccount() {
  return useContext(ThoriumAccountContext);
}