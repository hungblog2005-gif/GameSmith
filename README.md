# GameSmith

GameSmith is a full-stack application designed for managing and showcasing game assets. It includes a frontend built with React and Vite, and a backend powered by NestJS.

## Features

### Frontend
- **Modern UI**: Built with React and styled using TailwindCSS.
- **Dynamic Components**: Includes reusable components like `Navbar`, `Sidebar`, and `AssetCard`.
- **Localization**: Supports multiple languages using `react-i18next`.
- **Theme Support**: Light and dark mode toggle.

### Backend
- **NestJS Framework**: Provides a robust and scalable backend.
- **REST API**: Handles requests for managing game assets.
- **Testing**: Includes unit and e2e tests.

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/gamesmith.git
   cd gamesmith
   ```

2. Install dependencies:
   ```bash
   # For frontend
   cd frontend
   npm install

   # For backend
   cd ../backend
   npm install
   ```

3. Start the development servers:
   ```bash
   # Frontend
   cd frontend
   npm run dev

   # Backend
   cd ../backend
   npm run start:dev
   ```

## Folder Structure

```
GameSmith/
├── backend/       # Backend source code
├── frontend/      # Frontend source code
└── README.md      # Project documentation
```

## Contributing

1. Fork the repository.
2. Create a new branch for your feature:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add new feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

Happy coding!
