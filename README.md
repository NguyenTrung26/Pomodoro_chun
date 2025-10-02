# React + Vite + TailwindCSS + Lucide Icons

Dự án này được xây dựng với **React** và **Vite**, kết hợp **Tailwind CSS** để styling nhanh chóng và **lucide-react** để dùng icon hiện đại. Ứng dụng chính là **Pomodoro Timer** – giúp quản lý thời gian học tập/làm việc theo phương pháp Pomodoro.

---

## 👨‍💻 Người thực hiện

* **Nguyễn Trung – 22SE1**

---

## ⚡ Công nghệ sử dụng

* [Vite](https://vitejs.dev/) – công cụ bundler nhanh & nhẹ.
* [React](https://react.dev/) – thư viện UI phổ biến.
* [Tailwind CSS](https://tailwindcss.com/) – utility-first CSS framework.
* [lucide-react](https://lucide.dev/) – bộ icon hiện đại cho React.

---

## 🚀 Cài đặt & chạy project

### 1. Tạo project React + Vite

```bash
npm create vite@latest pomodoro-timer
cd pomodoro-timer
npm install
```

Chọn framework: **React** → **JavaScript**.

---

### 2. Cài Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Cập nhật `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Trong `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### 3. Cài đặt lucide-react

```bash
npm install lucide-react
```

Sử dụng icon:

```jsx
import { Play, Pause, RotateCcw } from "lucide-react";

function Example() {
  return (
    <div className="flex gap-2">
      <Play className="text-green-500" size={32} />
      <Pause className="text-red-500" size={32} />
      <RotateCcw className="text-gray-500" size={32} />
    </div>
  );
}
```

---

### 4. Thêm component Pomodoro

Trong `src/Pomodoro.jsx` copy toàn bộ code Pomodoro Timer.
Trong `src/App.jsx` import và render:

```jsx
import React from "react";
import Pomodoro from "./Pomodoro";

function App() {
  return <Pomodoro />;
}

export default App;
```

---

### 5. Chạy project

```bash
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173) để xem kết quả.

---

## 📦 Build & deploy

* Build sản phẩm:

  ```bash
  npm run build
  ```
* Preview build:

  ```bash
  npm run preview
  ```
* Có thể deploy dễ dàng lên **Vercel** hoặc **Netlify**.

---

✅ Bây giờ bạn đã có một project **Pomodoro Timer** hoàn chỉnh với React + Vite + TailwindCSS + Lucide Icons để quản lý thời gian hiệu quả.
