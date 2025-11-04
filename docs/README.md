# HarakaPoS Documentation

Welcome to the HarakaPoS documentation. This folder contains all technical documentation, guides, and system overviews.

## 📁 Documentation Structure

```
docs/
├── README.md (this file)
└── dispatch-system/
    ├── README.md
    ├── 01-system-overview.md
    ├── 02-testing-guide.md
    └── 03-deployment-guide.md
```

## 📚 Available Documentation

### [Dispatch System](./dispatch-system/)
Complete documentation for the order dispatch and delivery management system.

- **System Overview** - Architecture, database schema, and features
- **Testing Guide** - Comprehensive testing scenarios and verification
- **Deployment Guide** - Quick start and deployment checklist

## 🚀 Quick Links

### For Developers
- [Dispatch System Overview](./dispatch-system/01-system-overview.md)
- [Database Migrations](../supabase/migrations/)
- [Type Definitions](../lib/types.ts)

### For Testing
- [Testing Guide](./dispatch-system/02-testing-guide.md)
- [Deployment Checklist](./dispatch-system/03-deployment-guide.md)

### For Deployment
- [Deployment Guide](./dispatch-system/03-deployment-guide.md)
- [Migration Files](../supabase/migrations/)

## 📋 Document Naming Convention

All documentation follows this naming pattern for easy ordering:
```
XX-descriptive-name.md
```
Where `XX` is a two-digit number (01, 02, 03, etc.) indicating the reading order.

## 🔄 Keeping Documentation Updated

When adding new features:
1. Create a new folder under `docs/` for the feature
2. Add a `README.md` index in that folder
3. Use numbered prefixes for ordered documentation
4. Update this main README with links

## 📝 Documentation Standards

### Markdown Files Should Include:
- ✅ Clear headings hierarchy (H1 → H2 → H3)
- ✅ Code examples with syntax highlighting
- ✅ Step-by-step instructions where applicable
- ✅ Visual separators (horizontal rules, emojis)
- ✅ Table of contents for long documents

### SQL Files Should Include:
- ✅ Header comment with purpose and date
- ✅ Section comments for major blocks
- ✅ `IF NOT EXISTS` for idempotent operations
- ✅ `DROP ... IF EXISTS` before recreating objects
- ✅ Inline comments for complex logic

## 🏗️ Project Structure Reference

```
HarakaPoS/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Admin pages
│   └── driver/              # Driver pages
├── lib/                     # Shared utilities
│   ├── types.ts            # TypeScript types
│   └── supabase/           # Supabase client
├── supabase/
│   └── migrations/         # Database migrations
├── docs/                    # This documentation folder
│   └── dispatch-system/    # Dispatch system docs
├── utils/                   # Helper functions
└── README.md               # Project README
```

## 🤝 Contributing to Documentation

When adding documentation:
1. Place it in the appropriate feature folder
2. Use clear, descriptive filenames
3. Include code examples
4. Add cross-references to related docs
5. Update the feature's README.md index

---

**Last Updated:** November 4, 2025  
**Version:** 1.0.0
