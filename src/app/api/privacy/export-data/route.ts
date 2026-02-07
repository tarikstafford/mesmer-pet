import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        pets: {
          include: {
            petTraits: {
              include: {
                trait: true,
              },
            },
            petSkills: {
              include: {
                skill: true,
              },
            },
            warnings: true,
            interactions: true,
            memorySummaries: true,
            gameStates: true,
          },
        },
        userSkills: {
          include: {
            skill: true,
          },
        },
        recoveryItems: {
          include: {
            item: true,
          },
        },
        engagement: true,
        challenges: {
          include: {
            challenge: true,
          },
        },
        sentFriendRequests: {
          include: {
            addressee: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        receivedFriendRequests: {
          include: {
            requester: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        tutorial: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove sensitive data (password hash)
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        provider: user.provider,
        isAdmin: user.isAdmin,
        dateOfBirth: user.dateOfBirth,
        cookieConsent: user.cookieConsent,
        dataProcessingConsent: user.dataProcessingConsent,
        marketingConsent: user.marketingConsent,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      pets: user.pets,
      skills: user.userSkills,
      recoveryItems: user.recoveryItems,
      engagement: user.engagement,
      challenges: user.challenges,
      friends: {
        sent: user.sentFriendRequests,
        received: user.receivedFriendRequests,
      },
      tutorial: user.tutorial,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="mesmer-data-export-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
