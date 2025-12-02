export const SuiObject: React.FC<{ objectId: string }> = ({ objectId }) => {
  return (
    <div className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
      <p>
        <strong>Object ID:</strong> {objectId}
      </p>
      <p>Details unavailable in mock mode.</p>
    </div>
  );
};
