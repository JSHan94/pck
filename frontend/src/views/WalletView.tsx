import { FC, useState } from "react";
import { useCurrentAccount } from "../lib/wallet";
import { MySecretPanel } from "../components/wallet/MySecretPanel";

const WalletView: FC = () => {
  const account = useCurrentAccount();
  const [secretStatus, setSecretStatus] = useState("");

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="title">Wallet Info</h1>
      </div>
      <div className="flex flex-col items-center gap-6">
        <div className="w-full max-w-5xl">
          <MySecretPanel
            currentAccountAddress={account?.address}
            onStatus={(msg) => setSecretStatus(msg)}
          />
        </div>
        {secretStatus && (
          <div className="nes-container is-rounded w-full max-w-5xl">
            <p>{secretStatus}</p>
          </div>
        )}
      </div>
    </>
  )
}

export default WalletView;
