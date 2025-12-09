// src/app/api/auth/update-password/route.ts
import { NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin ONCE
let adminInitialized = false;

function initializeFirebaseAdmin() {
  if (adminInitialized) {
    console.log('✅ Firebase Admin already initialized');
    return;
  }

  try {
    console.log('🔧 Initializing Firebase Admin...');
    
    const serviceAccountPath = path.join(process.cwd(), 'firebase-admin-key.json');
    console.log('📁 Service account path:', serviceAccountPath);
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`File not found: ${serviceAccountPath}`);
    }
    
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    
    adminInitialized = true;
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Initialize Firebase Admin if not done yet
    initializeFirebaseAdmin();

    console.log('\n📥 Password reset request');
    
    const body = await request.json();
    const { token, userId, newPassword } = body;

    console.log('User ID:', userId);

    if (!token || !userId || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    console.log('🔍 Validating token...');

    const db = getFirebaseDb();
    const resetDoc = await getDoc(doc(db, 'passwordResets', userId));

    if (!resetDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Invalid reset request' },
        { status: 400 }
      );
    }

    const resetData = resetDoc.data();

    if (resetData.used) {
      return NextResponse.json(
        { success: false, error: 'Reset link already used' },
        { status: 400 }
      );
    }

    if (resetData.token !== token) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 }
      );
    }

    const expiresAt = resetData.expiresAt.toDate();
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Reset link expired' },
        { status: 400 }
      );
    }

    console.log('✅ Token valid, updating password...');

    await admin.auth().updateUser(userId, {
      password: newPassword,
    });

    console.log('✅ Password updated successfully!\n');

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}