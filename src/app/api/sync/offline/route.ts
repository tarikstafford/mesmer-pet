// US-025: Queue and process offline actions
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  queueOfflineAction,
  getPendingOfflineActions,
  markActionSynced,
  markActionFailed,
  type Platform,
} from '@/lib/sync';

/**
 * GET: Retrieve pending offline actions
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const petId = searchParams.get('petId');

    const actions = await getPendingOfflineActions(user.userId, petId || undefined);

    return NextResponse.json({
      success: true,
      data: {
        actions: actions.map((action) => ({
          id: action.id,
          petId: action.petId,
          actionType: action.actionType,
          actionData: JSON.parse(action.actionData),
          createdAt: action.createdAt,
          attempts: action.attempts,
        })),
      },
    });
  } catch (error) {
    console.error('Get offline actions error:', error);
    return NextResponse.json(
      { error: 'Failed to get offline actions' },
      { status: 500 }
    );
  }
}

/**
 * POST: Queue a new offline action
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { petId, actionType, actionData, platform = 'web', deviceId } = body;

    if (!actionType || !actionData) {
      return NextResponse.json(
        { error: 'Missing required fields: actionType, actionData' },
        { status: 400 }
      );
    }

    const actionId = await queueOfflineAction(
      user.userId,
      petId || null,
      actionType,
      actionData,
      platform as Platform,
      deviceId
    );

    return NextResponse.json({
      success: true,
      data: {
        actionId,
        message: 'Action queued for sync',
      },
    });
  } catch (error) {
    console.error('Queue offline action error:', error);
    return NextResponse.json(
      { error: 'Failed to queue offline action' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update offline action status (mark as synced/failed)
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { actionId, status, error } = body;

    if (!actionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: actionId, status' },
        { status: 400 }
      );
    }

    if (status === 'synced') {
      await markActionSynced(actionId);
    } else if (status === 'failed') {
      await markActionFailed(actionId, error || 'Unknown error');
    } else {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Action marked as ${status}`,
      },
    });
  } catch (error) {
    console.error('Update offline action error:', error);
    return NextResponse.json(
      { error: 'Failed to update offline action' },
      { status: 500 }
    );
  }
}
