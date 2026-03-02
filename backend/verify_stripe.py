#!/usr/bin/env python
"""
Verify Stripe configuration without requiring Django initialization.
Run this to check if Stripe keys are properly loaded.
"""

import os
import sys
from pathlib import Path

def verify_stripe():
    backend_dir = Path(__file__).parent
    env_file = backend_dir / '.env'
    
    print("\n" + "="*60)
    print("🔍 STRIPE CONFIGURATION VERIFICATION")
    print("="*60)
    
    # Check if .env file exists
    if not env_file.exists():
        print("\n❌ .env file not found at:", env_file)
        return False
    
    print("\n✅ .env file found at:", env_file)
    
    # Load .env manually
    try:
        from dotenv import load_dotenv
        print("✅ python-dotenv is installed")
    except ImportError:
        print("❌ python-dotenv is NOT installed")
        print("   Run: pip install python-dotenv")
        return False
    
    # Load environment
    load_dotenv(env_file, override=True)
    
    # Check Stripe keys
    stripe_secret = os.environ.get('STRIPE_SECRET_KEY', '').strip()
    stripe_public = os.environ.get('STRIPE_PUBLISHABLE_KEY', '').strip()
    
    print("\n" + "-"*60)
    print("Stripe Configuration Status:")
    print("-"*60)
    
    secret_ok = bool(stripe_secret)
    public_ok = bool(stripe_public)
    
    if secret_ok:
        key_start = stripe_secret[:10]
        key_end = stripe_secret[-10:]
        print(f"✅ STRIPE_SECRET_KEY: {key_start}...{key_end}")
        print(f"   (Length: {len(stripe_secret)} chars)")
    else:
        print("❌ STRIPE_SECRET_KEY: NOT SET")
    
    if public_ok:
        key_start = stripe_public[:10]
        key_end = stripe_public[-10:]
        print(f"✅ STRIPE_PUBLISHABLE_KEY: {key_start}...{key_end}")
        print(f"   (Length: {len(stripe_public)} chars)")
    else:
        print("❌ STRIPE_PUBLISHABLE_KEY: NOT SET")
    
    # Check Stripe package
    try:
        import stripe
        print(f"✅ stripe package installed (version: {stripe.__version__})")
    except ImportError:
        print("❌ stripe package NOT installed")
        print("   Run: pip install stripe")
        return False
    
    print("\n" + "="*60)
    if secret_ok and public_ok:
        print("✅ STRIPE IS FULLY CONFIGURED AND READY!")
        print("="*60 + "\n")
        return True
    else:
        print("❌ STRIPE CONFIGURATION INCOMPLETE")
        print("="*60 + "\n")
        return False

if __name__ == '__main__':
    success = verify_stripe()
    sys.exit(0 if success else 1)
