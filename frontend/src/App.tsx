import { useNavigation } from "./providers/navigation/NavigationContext";
import NavBar from "./components/shared/Navbar";
import { NavigationProvider } from "./providers/navigation/NavigationProvider";

import HomeView from "./views/HomeView";
import VaultView from "./views/VaultView";
import LotteryDetailPage from "./components/lottery/components/LotteryDetailPage";

const Pages: React.FC = () => {
  const { currentPage } = useNavigation();

  if (currentPage === "/" || currentPage === "") {
    return <HomeView />;
  }



  if (currentPage === "/vault") {
    return <VaultView />;
  }

  if (currentPage.startsWith("/lottery/")) {
    const gameId = decodeURIComponent(currentPage.replace("/lottery/", ""));
    return <LotteryDetailPage gameId={gameId} />;
  }

  return <div className="text-center">Page not found!</div>;
};

const App: React.FC = () => {
  return (
    <NavigationProvider>
      <div className="min-h-screen gradient-bg">
        <NavBar />
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          <Pages />
        </div>
      </div>
    </NavigationProvider>
  );
};

export default App;
