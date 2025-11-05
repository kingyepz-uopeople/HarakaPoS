# 📘 Setup Guides

Step-by-step guides for configuring HarakaPOS features

---

## 📑 Available Guides

### 🧾 [eTIMS Setup Guide](./ETIMS_SETUP_GUIDE.md)
**Complete guide to Kenya Revenue Authority eTIMS integration**

**What you'll learn:**
- eTIMS system overview
- How to get KRA credentials
- Configuration in HarakaPOS
- Testing the integration
- Troubleshooting common issues

**Time required:** 30-45 minutes

**Prerequisites:**
- KRA PIN registered
- Active eTIMS account with KRA
- Admin access to HarakaPOS

---

### ⚡ [Quick Start eTIMS](./QUICK_START_ETIMS.md)
**Fast-track eTIMS setup for experienced users**

**What you'll learn:**
- Quick configuration (5 steps)
- Essential settings only
- Rapid testing

**Time required:** 15 minutes

**Prerequisites:**
- eTIMS credentials ready
- Basic eTIMS knowledge

**Best for:** Users familiar with eTIMS who just need HarakaPOS-specific setup

---

### 📦 [Barcode Setup Guide](./BARCODE_SETUP_GUIDE.md)
**Complete barcode delivery tracking system setup**

**What you'll learn:**
- Barcode system architecture
- Database migration
- Generating barcodes
- Printing labels
- Mobile scanner setup
- GPS tracking
- Photo capture
- Troubleshooting

**Time required:** 10-20 minutes

**Prerequisites:**
- Database migrations run
- Mobile device with camera
- HTTPS enabled (for camera access)

---

## 🎯 Which Guide Should I Use?

### New to eTIMS?
→ Start with **[eTIMS Setup Guide](./ETIMS_SETUP_GUIDE.md)**

### Already know eTIMS?
→ Use **[Quick Start eTIMS](./QUICK_START_ETIMS.md)**

### Setting up delivery tracking?
→ Follow **[Barcode Setup Guide](./BARCODE_SETUP_GUIDE.md)**

### First time with HarakaPOS?
1. Read main **[Documentation](../README.md)**
2. Run **[Database Migrations](../../supabase/migrations/README.md)**
3. Follow setup guides for features you need

---

## 📋 Setup Checklist

### Initial System Setup
- [ ] Database migrations run
- [ ] Environment variables configured
- [ ] Admin account created
- [ ] Basic products added
- [ ] Test customer created

### eTIMS Setup (if applicable)
- [ ] KRA credentials obtained
- [ ] eTIMS guide completed
- [ ] Connection tested
- [ ] Test invoice submitted
- [ ] Control code received

### Barcode System Setup (if applicable)
- [ ] Barcode migration run
- [ ] Test barcode generated
- [ ] Label printed successfully
- [ ] Mobile scanner tested
- [ ] GPS permissions granted
- [ ] Camera permissions granted

### User Training
- [ ] Admin trained
- [ ] Cashiers trained
- [ ] Drivers trained
- [ ] Documentation provided

---

## 🚀 Quick Links

### Documentation
- [Main Documentation](../README.md)
- [Database Migrations](../../supabase/migrations/README.md)
- [Implementation Summary](../COMPLETE_IMPLEMENTATION_SUMMARY.md)

### Implementation Details
- [eTIMS Implementation](../ETIMS_IMPLEMENTATION_COMPLETE.md)
- [System Architecture](../README.md#system-architecture)

---

## 💡 Tips for Success

### Before You Start
1. ✅ Read the relevant guide completely first
2. ✅ Gather all required credentials/info
3. ✅ Test in development before production
4. ✅ Have backup admin access ready

### During Setup
1. ✅ Follow steps in order
2. ✅ Verify each step before proceeding
3. ✅ Take notes of any issues
4. ✅ Don't skip verification steps

### After Setup
1. ✅ Test thoroughly
2. ✅ Train users
3. ✅ Document any customizations
4. ✅ Keep guides for reference

---

## 🔧 Troubleshooting

### Setup Not Working?
1. Check you completed all prerequisites
2. Review error messages carefully
3. Verify credentials are correct
4. Check guide's troubleshooting section
5. Review Supabase logs
6. Check browser console (F12)

### Common Issues
- **eTIMS connection failed:** Check credentials, internet, KRA status
- **Barcode scanner not working:** Camera permissions, HTTPS required
- **Database errors:** Verify migrations run successfully

---

## 📞 Getting Help

### Self-Help Resources
1. Read the specific guide's troubleshooting section
2. Check [Main Documentation](../README.md)
3. Review console/logs for errors
4. Verify prerequisites met

### When to Escalate
- Credentials verified but still failing
- Persistent database errors
- System-wide issues

---

## 📝 Contributing

Found an issue in a guide? Have a suggestion?

1. Document the issue clearly
2. Include steps to reproduce
3. Provide error messages
4. Note your environment (OS, browser, etc.)

---

**Choose your guide above and get started!** 🚀

*Last updated: November 5, 2025*
