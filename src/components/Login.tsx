import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [signinForm, setSigninForm] = useState({
    email: "",
    password: "",
  });
  const [noti, setNoti] = useState<string | null>(null);
  const navi = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setSigninForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signinForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setNoti(data.message);
      }

      setNoti(data.message);
      navi("/home");
    } catch (error) {
      setNoti(error instanceof Error ? error.message : "something wrong");
    }
  };
  return (
    <div>
      Login
      <form onSubmit={submitForm}>
        <div className="signupFormBox">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Email"
            onChange={handleChange}
            value={signinForm.email}
            required
          />
        </div>
        <div className="signupFormBox">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="password"
            onChange={handleChange}
            value={signinForm.password}
            required
          />
        </div>
        <button>Signup</button>
      </form>
      <p>{noti}</p>
    </div>
  );
}
