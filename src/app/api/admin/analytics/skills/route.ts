import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdminAuth(request);

    // Get analytics for all skills
    const skillAnalytics = await prisma.skill.findMany({
      select: {
        id: true,
        skillName: true,
        category: true,
        price: true,
        featured: true,
        active: true,
        createdAt: true,
        userSkills: {
          select: {
            id: true,
            purchaseDate: true,
            userId: true,
          },
        },
        _count: {
          select: {
            userSkills: true,
            petSkills: true,
          },
        },
      },
      orderBy: {
        userSkills: {
          _count: 'desc', // Most purchased first
        },
      },
    });

    // Calculate analytics metrics
    const analytics = skillAnalytics.map((skill) => {
      const totalPurchases = skill._count.userSkills;
      const totalRevenue = totalPurchases * skill.price;
      const totalActivations = skill._count.petSkills;

      // Get purchase dates for trend analysis
      const purchases = skill.userSkills.map(us => us.purchaseDate);
      const last30Days = purchases.filter(
        date => new Date(date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;
      const last7Days = purchases.filter(
        date => new Date(date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      return {
        skillId: skill.id,
        skillName: skill.skillName,
        category: skill.category,
        price: skill.price,
        featured: skill.featured,
        active: skill.active,
        createdAt: skill.createdAt,
        totalPurchases,
        totalRevenue,
        totalActivations,
        purchasesLast7Days: last7Days,
        purchasesLast30Days: last30Days,
        activationRate: totalPurchases > 0 ? (totalActivations / totalPurchases) * 100 : 0,
      };
    });

    // Calculate overall summary
    const summary = {
      totalSkills: skillAnalytics.length,
      activeSkills: skillAnalytics.filter(s => s.active).length,
      totalPurchases: analytics.reduce((sum, s) => sum + s.totalPurchases, 0),
      totalRevenue: analytics.reduce((sum, s) => sum + s.totalRevenue, 0),
      averagePrice: skillAnalytics.reduce((sum, s) => sum + s.price, 0) / skillAnalytics.length,
      purchasesLast7Days: analytics.reduce((sum, s) => sum + s.purchasesLast7Days, 0),
      purchasesLast30Days: analytics.reduce((sum, s) => sum + s.purchasesLast30Days, 0),
    };

    return NextResponse.json({
      analytics,
      summary,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Admin access required')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes('token') || error.message.includes('authorization')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
