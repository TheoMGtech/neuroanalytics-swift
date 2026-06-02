import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = () => {
  return (
    <div className="bg-surface-faint text-on-surface font-body-md min-h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px] min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto mt-16 p-margin-desktop bg-surface-faint">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
