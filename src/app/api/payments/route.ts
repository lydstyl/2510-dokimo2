import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';
import { PrismaPaymentRepository } from '@/infrastructure/repositories/PrismaPaymentRepository';
import { RecordPayment } from '@/use-cases/RecordPayment';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leaseId = searchParams.get('leaseId');

    if (!leaseId) {
      return NextResponse.json(
        { error: 'leaseId is required' },
        { status: 400 }
      );
    }

    const repository = new PrismaPaymentRepository(prisma);
    const payments = await repository.findByLeaseId(leaseId);

    return NextResponse.json(
      payments.map(payment => ({
        id: payment.id,
        leaseId: payment.leaseId,
        amount: payment.amount.getValue(),
        paymentDate: payment.paymentDate,
        notes: payment.notes,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leaseId, amount, paymentDate, notes } = body;

    if (!leaseId || amount === undefined || !paymentDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const repository = new PrismaPaymentRepository(prisma);
    const useCase = new RecordPayment(repository);

    const payment = await useCase.execute({
      leaseId,
      amount: Number(amount),
      paymentDate: new Date(paymentDate),
      notes,
    });

    return NextResponse.json(
      {
        id: payment.id,
        leaseId: payment.leaseId,
        amount: payment.amount.getValue(),
        paymentDate: payment.paymentDate,
        notes: payment.notes,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 400 }
    );
  }
}
