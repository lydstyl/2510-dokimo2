import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/infrastructure/auth/session';
import { prisma } from '@/infrastructure/database/prisma';

// GET /api/boilers/export - Export boilers info as .txt for plumber
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all boilers with their property and latest maintenance
    const boilers = await prisma.boiler.findMany({
      include: {
        property: {
          include: {
            leases: {
              where: {
                startDate: { lte: new Date() },
                OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
              },
              include: {
                tenants: {
                  include: {
                    tenant: true,
                  },
                },
              },
              orderBy: {
                startDate: 'desc',
              },
              take: 1,
            },
          },
        },
        maintenances: {
          orderBy: {
            maintenanceDate: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate text content
    let textContent = '='.repeat(80) + '\n';
    textContent += 'LISTE DES CHAUDIÈRES - ENTRETIEN\n';
    textContent += `Généré le: ${new Date().toLocaleDateString('fr-FR')}\n`;
    textContent += '='.repeat(80) + '\n\n';

    boilers.forEach((boiler, index) => {
      const latestMaintenance = boiler.maintenances[0];
      const activeLease = boiler.property.leases[0];

      textContent += `\n${'─'.repeat(80)}\n`;
      textContent += `CHAUDIÈRE #${index + 1}\n`;
      textContent += `${'─'.repeat(80)}\n\n`;

      // Boiler info
      if (boiler.name) {
        textContent += `Nom de la chaudière: ${boiler.name}\n`;
      }
      if (boiler.notes) {
        textContent += `Notes: ${boiler.notes}\n`;
      }

      // Property info
      textContent += `\nADRESSE DU BIEN:\n`;
      textContent += `  ${boiler.property.address}\n`;
      textContent += `  ${boiler.property.postalCode} ${boiler.property.city}\n`;

      // Tenant info
      if (activeLease && activeLease.tenants && activeLease.tenants.length > 0) {
        textContent += `\nLOCATAIRE${activeLease.tenants.length > 1 ? 'S' : ''}:\n`;
        activeLease.tenants.forEach((leaseTenant: any) => {
          const tenantData = leaseTenant.tenant;
          const civility = tenantData.civility || '';
          textContent += `  ${civility} ${tenantData.firstName} ${tenantData.lastName}\n`;
          if (tenantData.email) {
            textContent += `    Email: ${tenantData.email}\n`;
          }
          if (tenantData.phone) {
            textContent += `    Téléphone: ${tenantData.phone}\n`;
          }
        });
      } else {
        textContent += `\nLOCATAIRE: Aucun locataire actuel\n`;
      }

      // Maintenance info
      if (latestMaintenance) {
        const maintenanceDate = new Date(latestMaintenance.maintenanceDate);
        const nextMaintenanceDate = new Date(maintenanceDate);
        nextMaintenanceDate.setFullYear(nextMaintenanceDate.getFullYear() + 1);

        textContent += `\nDERNIER ENTRETIEN:\n`;
        textContent += `  Date: ${maintenanceDate.toLocaleDateString('fr-FR')}\n`;
        textContent += `\nPROCHAIN ENTRETIEN IDÉAL:\n`;
        textContent += `  Date: ${nextMaintenanceDate.toLocaleDateString('fr-FR')}\n`;
      } else {
        textContent += `\nDERNIER ENTRETIEN: Aucun entretien enregistré\n`;
        textContent += `PROCHAIN ENTRETIEN IDÉAL: À définir\n`;
      }

      textContent += '\n';
    });

    textContent += '\n' + '='.repeat(80) + '\n';
    textContent += `Total: ${boilers.length} chaudière(s)\n`;
    textContent += '='.repeat(80) + '\n';

    // Return as downloadable file
    return new NextResponse(textContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="chaudieres-entretien-${new Date().toISOString().split('T')[0]}.txt"`,
      },
    });
  } catch (error) {
    console.error('Error exporting boilers:', error);
    return NextResponse.json({ error: 'Failed to export boilers' }, { status: 500 });
  }
}
