export default function Footer() {
  return (
    <footer className="bg-card text-card-foreground py-8 mt-12 border-t">
      <div className="container mx-auto px-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} ChattyRental. Todos los derechos reservados.</p>
        <p className="mt-1">Una plataforma de alquiler profesional.</p>
      </div>
    </footer>
  );
}
