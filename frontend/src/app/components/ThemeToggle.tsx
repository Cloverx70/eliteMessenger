export default function ThemeToggle() {
  const toggleDarkMode = () => {
    const html = document.documentElement;

    html.classList.toggle("dark");

    localStorage.setItem(
      "theme",
      html.classList.contains("dark") ? "dark" : "light",
    );
  };

  return <button onClick={toggleDarkMode}>Toggle Theme</button>;
}
