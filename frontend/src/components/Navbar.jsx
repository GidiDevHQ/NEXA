import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

const Navbar = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
    setMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            Nexa
          </Link>

          {/* Desktop nav */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">Home</Link>
              <Link to="/explore" className="text-gray-700 hover:text-blue-600 transition-colors">Explore</Link>
              <Link to="/create-post" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Create Post</Link>
              <Link to="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">{user?.username || 'Profile'}</Link>
              <button onClick={handleSignOut} className="text-gray-700 hover:text-red-600 transition-colors">Sign Out</button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/explore" className="text-gray-700 hover:text-blue-600 transition-colors">Explore</Link>
              <Link to="/signin" className="text-gray-700 hover:text-blue-600 transition-colors">Sign In</Link>
              <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Sign Up</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link to="/" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Home</Link>
                <Link to="/explore" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Explore</Link>
                <Link to="/create-post" onClick={() => setMenuOpen(false)} className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Post</Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">{user?.username || 'Profile'}</Link>
                <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/explore" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Explore</Link>
                <Link to="/signin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Sign In</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
