# 📁 Hướng dẫn Git cho dự án Quản Lý Phòng Trọ V2

## 🚫 Files bị Gitignore

### Database Files
- `*.sql.bak`, `*.db.bak` - Backup database
- `*.sqlite.tmp`, `*.db.tmp` - Temporary database files
- ✅ `server/data.sqlite` - **ĐƯỢC GIỮ LẠI** để chia sẻ dữ liệu mẫu

### Dependencies
- `node_modules/` - Thư viện Node.js
- `package-lock.json` - Lock file (có thể commit tùy team)
- `yarn.lock` - Yarn lock file

### Build & Cache
- `.expo/` - Expo cache
- `dist/`, `build/` - Build outputs
- `.metro-cache/` - Metro bundler cache
- `web-build/` - Web build

### Environment & Config
- `.env*` - Environment variables
- `config.json` - Config files
- `secrets.json` - Secret files

### IDE & OS
- `.vscode/`, `.idea/` - IDE settings
- `.DS_Store` - macOS files
- `Thumbs.db` - Windows files

## 🔧 Setup Git

### 1. Khởi tạo repository
```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. Tạo database
```bash
cd server
node src/seed.js
```

### 3. Cấu hình Git
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## 📋 Git Workflow

### Branch Strategy
- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Hotfix branches

### Commit Convention
```
type(scope): description

feat(auth): add login functionality
fix(api): resolve database connection issue
docs(readme): update installation guide
style(ui): improve button design
refactor(db): optimize query performance
test(auth): add unit tests for login
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Maintenance

## 🚀 Deployment

### Development
```bash
# Start server
cd server
npm start

# Start app
cd app
npm start
```

### Production
```bash
# Build app
cd app
expo build:android
expo build:ios

# Deploy server
cd server
npm install --production
pm2 start index.js
```

## 🔒 Security

### Sensitive Data
- Environment variables trong `.env`
- API keys và secrets
- Private keys và certificates
- ✅ Database được commit để chia sẻ dữ liệu mẫu

### Best Practices
1. Luôn sử dụng `.env` cho config
2. ✅ Commit database để chia sẻ dữ liệu mẫu
3. Sử dụng `.env.example` cho template
4. Review code trước khi merge
5. Sử dụng branch protection rules

## 📁 Project Structure
```
QuanLyPhongTroV2/
├── .gitignore              # Main gitignore
├── app/
│   ├── .gitignore         # App-specific gitignore
│   └── ...
├── server/
│   ├── .gitignore         # Server-specific gitignore
│   ├── data.sqlite        # Database (được commit)
│   └── ...
└── GIT.md                 # This file
```

## 🆘 Troubleshooting

### Database Issues
```bash
# Reset database
rm server/data.sqlite
cd server
node src/seed.js
```

### Cache Issues
```bash
# Clear Expo cache
cd app
expo start --clear

# Clear Metro cache
cd app
npx react-native start --reset-cache
```

### Git Issues
```bash
# Reset to last commit
git reset --hard HEAD

# Clean untracked files
git clean -fd

# Reset specific file
git checkout HEAD -- filename
```

## 📚 Resources

- [Git Documentation](https://git-scm.com/doc)
- [React Native Gitignore](https://github.com/github/gitignore/blob/main/ReactNative.gitignore)
- [Node.js Gitignore](https://github.com/github/gitignore/blob/main/Node.gitignore)
- [Expo Documentation](https://docs.expo.dev/)
