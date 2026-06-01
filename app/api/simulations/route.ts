export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const body = await req.json();
    const sim = await prisma.simulation.create({
      data: {
        userId: (session.user as any)?.id ?? '',
        name: body?.name ?? 'Simulação',
        modelo: body?.modelo ?? '',
        cenario: body?.cenario ?? '',
        config: JSON.stringify(body?.config ?? {}),
        results: JSON.stringify(body?.results ?? {}),
      },
    });
    return NextResponse.json(sim);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const sims = await prisma.simulation.findMany({
      where: { userId: (session.user as any)?.id ?? '' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(sims);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 });
  }
}
