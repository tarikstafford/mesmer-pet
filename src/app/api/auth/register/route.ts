import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateVerificationToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { email, password, name, dateOfBirth } = validationResult.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate verification token
    const verificationToken = generateVerificationToken()

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        emailVerified: false, // Will be set to true after email verification
      },
    })

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    // TODO: Send verification email (implement in future iteration)
    // For MVP, we'll skip email sending and consider it verified
    // In production, you'd send an email with the verification link

    return NextResponse.json(
      {
        message: 'User registered successfully',
        userId: user.id,
        email: user.email,
        verificationToken, // In production, this would be sent via email
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
