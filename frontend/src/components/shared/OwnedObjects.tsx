import { useCurrentAccount } from "../../lib/wallet";

export const OwnedObjects = () => {
  const account = useCurrentAccount();

  if (!account) {
    return null;
  }

  return (
    <div className="flex flex-col my-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
      <p>Mock chain: owned objects are not available.</p>
    </div>
  );
}
