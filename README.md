# Program Corporate Social Responsibility Dashboard

A responsive admin dashboard for monitoring Corporate Social Responsibility (CSR) programs at Estate Cerenti. The app centralises Pre-Post Test analytics, MSE offline submissions, and administrator settings inside a single Firebase-backed experience.

## Features
- **Secure authentication** – phone-based login/signup stored in Firebase Authentication & Firestore.
- **Pre-Post Test analytics** – upload Excel/CSV datasets, review charts, export participant rankings, edit or delete data, and view auto-generated statistics.
- **MSE offline management** – review monitoring entries from manual uploads and field submissions, compare time ranges, and inspect detail modals.
- **Admin settings** – update admin profile, rotate passwords, inspect detailed activity logs, and manage participant accounts stored in Realtime Database.
- **Activity logging** – every critical mutation (upload, edit, delete) is logged to Firestore for traceability.
- **Responsive UI** – optimised layouts for desktop and mobile with Tailwind CSS and Poppins typography.

## Tech Stack
- [React 18](https://react.dev/) with Vite
- Tailwind CSS
- Firebase (Authentication, Firestore, Realtime Database)
- Chart.js via `react-chartjs-2`
- Excel/CSV parsing with `exceljs` & `papaparse`

## Prerequisites
- Node.js 18+
- npm 9+
- Firebase project with Authentication, Firestore, and Realtime Database enabled

## Environment Variables
Create a `.env` file in the project root (same level as `package.json`) and provide the Firebase configuration keys:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the development server**
   ```bash
   npm run dev
   ```
   The Vite server prints a local URL (default `http://localhost:5173`).
3. **Lint the project**
   ```bash
   npm run lint
   ```
4. **Create a production build**
   ```bash
   npm run build
   ```

## Usage Notes
- Pre/Post Test uploads accept `.xlsx`, `.xls`, or `.csv` files with participant columns: `Nama`, `Nama Desa`, `Nama Posyandu`, `Nilai Pre Test`, and `Nilai Post Test`.
- Editing a dataset allows metadata changes without re-uploading a file; upload a new file to recalculate statistics.
- Activity logs are stored in the Firestore `logs` & `activityLogs` collections.
- Admin settings rely on phone numbers as document IDs in `users` collection.

## Project Structure
```
src/
├─ components/
│  ├─ auth/              # Login & signup forms
│  ├─ mse/               # MSE dashboards & modals
│  ├─ preposttest/       # Pre/Post Test dashboards, charts, modals
│  ├─ setting/           # Admin configuration screens
│  └─ SettingModal.jsx   # Quick overlay modal for user profile/logs
├─ utils/                # Excel parsing + logging helpers
├─ firebase.js           # Firebase client setup
├─ App.jsx               # Application shell & routing between modules
└─ main.jsx              # React entrypoint
```

## Contributing
1. Fork & clone the repository.
2. Create a branch for your feature/fix.
3. Ensure `npm run lint` passes and include relevant documentation updates.
4. Open a Pull Request describing your changes.

## License
This project is proprietary to the Estate Cerenti CSR team. Contact the maintainers for reuse permissions.
