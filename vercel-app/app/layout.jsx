import "./styles.css";

export const metadata = {
  title: "WMS Config Explorer Admin",
  description: "Admin portal and API for WMS Config Explorer"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
