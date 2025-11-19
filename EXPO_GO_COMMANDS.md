# 📱 Expo Go QR Code Commands

## Quick Start

```bash
cd /Users/jorgecarvalho/Desktop/bolt/AiFitnessExpo
npx expo start
```

This will:
- Start the Expo development server
- Display a QR code in the terminal
- Open the Expo DevTools in your browser

## Alternative Commands

### Start with QR code only (no browser)
```bash
cd /Users/jorgecarvalho/Desktop/bolt/AiFitnessExpo
npx expo start --no-dev-client
```

### Start and clear cache
```bash
cd /Users/jorgecarvalho/Desktop/bolt/AiFitnessExpo
npx expo start --clear
```

### Start in tunnel mode (if on different network)
```bash
cd /Users/jorgecarvalho/Desktop/bolt/AiFitnessExpo
npx expo start --tunnel
```

## How to Use

1. **Run the command above**
2. **Open Expo Go app** on your phone (iOS or Android)
3. **Scan the QR code** displayed in the terminal
4. Your app will load on your device!

## Troubleshooting

If QR code doesn't appear:
- Make sure your phone and computer are on the same WiFi network
- Try `npx expo start --tunnel` for different networks
- Check that port 8081 is not blocked by firewall

