const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ALL_SYSTEM_FEATURES = [
  'attendance_leave',
  'employee_directory',
  'shifts_calendars',
  'payroll_operations',
  'benefits_insurance',
  'recruitment_pipeline',
  'ai_resume_scoring',
  'performance_kpi',
  'approval_workflows',
  'documents_vault',
  'support_tickets',
  'backup_center',
  'offboarding_exit',
  'advanced_reports',
  'audit_compliance'
];

async function syncPlansAndFeatures() {
  console.log('🔄 Syncing Pricing Plans and Features in database...');

  // 1. Ensure Enterprise plan exists
  let enterprisePlan = await prisma.pricingPlan.findFirst({
    where: { name: 'Enterprise' }
  });

  if (!enterprisePlan) {
    enterprisePlan = await prisma.pricingPlan.create({
      data: {
        name: 'Enterprise',
        description: 'Tailored security, unlimited scaling, and full features.',
        monthlyPrice: 99,
        yearlyPrice: 948,
        currency: 'USD',
        billingCycle: 'Both',
        trialDays: 30,
        maxEmployees: 9999,
        maxAdmins: 99,
        storageLimit: 500,
        aiCredits: 5000,
        supportLevel: 'Dedicated Account Manager',
        buttonText: 'Contact Enterprise',
        buttonLink: '/book-demo',
        isPopular: false,
        isActive: true,
        displayOrder: 2
      }
    });
  }

  // 2. Ensure Professional plan exists
  let proPlan = await prisma.pricingPlan.findFirst({
    where: { name: 'Professional' }
  });

  // 3. Sync features for Enterprise (all features)
  for (let i = 0; i < ALL_SYSTEM_FEATURES.length; i++) {
    const feat = ALL_SYSTEM_FEATURES[i];
    const exists = await prisma.pricingFeature.findFirst({
      where: {
        pricingPlanId: enterprisePlan.id,
        feature: feat
      }
    });

    if (!exists) {
      await prisma.pricingFeature.create({
        data: {
          pricingPlanId: enterprisePlan.id,
          feature: feat,
          displayOrder: i
        }
      });
    }
  }

  // 4. Sync features for Professional (core + intermediate features)
  if (proPlan) {
    for (let i = 0; i < ALL_SYSTEM_FEATURES.length; i++) {
      const feat = ALL_SYSTEM_FEATURES[i];
      const exists = await prisma.pricingFeature.findFirst({
        where: {
          pricingPlanId: proPlan.id,
          feature: feat
        }
      });

      if (!exists) {
        await prisma.pricingFeature.create({
          data: {
            pricingPlanId: proPlan.id,
            feature: feat,
            displayOrder: i
          }
        });
      }
    }
  }

  // 5. Connect any organizations that have null pricingPlanId to the Enterprise plan
  const orgsWithNoPlan = await prisma.organization.findMany({
    where: { pricingPlanId: null }
  });

  for (const org of orgsWithNoPlan) {
    await prisma.organization.update({
      where: { id: org.id },
      data: { pricingPlanId: enterprisePlan.id }
    });
    console.log(`- Linked organization "${org.name}" to Enterprise plan.`);
  }

  console.log('✅ All Plans, Features, and Organizations synchronized successfully!');
}

syncPlansAndFeatures()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
