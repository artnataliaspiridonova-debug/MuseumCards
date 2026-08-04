import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="auth-shell">
      <section className="auth-intro">
        <span className="auth-logo">MA</span>
        <p>Museum Adventure Cards</p>
        <h1>Примите приглашение</h1>
        <p>
          Создайте личный доступ к игре. Регистрация открыта
          только приглашённым участникам.
        </p>
      </section>

      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />

      <p className="auth-credit">
        Игра создана культурологом и исследователем
        Натальей Спиридоновой
      </p>
    </main>
  );
}
