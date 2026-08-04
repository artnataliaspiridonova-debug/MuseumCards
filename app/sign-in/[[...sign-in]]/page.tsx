import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="auth-shell">
      <section className="auth-intro">
        <span className="auth-logo">MA</span>
        <p>Museum Adventure Cards</p>
        <h1>Добро пожаловать в музейное приключение</h1>
        <p>
          Войдите по адресу электронной почты, на который
          Наталья Спиридонова отправила приглашение.
        </p>
      </section>

      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />

      <p className="auth-credit">
        Игра создана культурологом и исследователем
        Натальей Спиридоновой
      </p>
    </main>
  );
}
