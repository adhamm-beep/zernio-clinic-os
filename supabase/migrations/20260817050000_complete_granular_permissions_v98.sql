-- Complete action-level permission catalog. Existing broad *.manage permissions
-- remain valid as compatibility fallbacks while each screen adopts these codes.
with permission_seed(code, name, module, description) as (values
  ('dashboard.appointments.view', 'View dashboard appointments', 'dashboard', 'Show the appointment workspace on the dashboard'),
  ('dashboard.invoices.view', 'View dashboard invoices', 'dashboard', 'Show invoice cards on the dashboard'),
  ('dashboard.summary.view', 'View dashboard summary', 'dashboard', 'Show the operational summary tab'),
  ('customers.contact.view', 'View patient contact details', 'customers', 'View phone, email and address'),
  ('customers.financial.view', 'View patient financial details', 'customers', 'View patient balance, invoices and payments'),
  ('customers.tags.manage', 'Manage patient tags', 'customers', 'Assign and remove patient tags'),
  ('customers.referrals.manage', 'Manage patient referrals', 'customers', 'Assign and edit referral source'),
  ('customers.balance.manage', 'Manage patient wallet balance', 'customers', 'Credit or debit patient wallet balance'),
  ('appointments.status.update', 'Update appointment status', 'appointments', 'Change appointment workflow status'),
  ('appointments.confirm', 'Confirm appointments', 'appointments', 'Confirm a booked appointment'),
  ('appointments.check_in', 'Check in appointments', 'appointments', 'Register patient arrival'),
  ('appointments.assign_staff', 'Assign appointment staff', 'appointments', 'Assign doctor or department'),
  ('payments.invoice.create', 'Issue invoices', 'payments', 'Create and issue patient invoices'),
  ('payments.split.create', 'Create split payments', 'payments', 'Split payment between cash, bank and other methods'),
  ('payments.void', 'Void financial records', 'payments', 'Void an invoice or payment with audit trail'),
  ('services.create', 'Create services', 'services', 'Create services and treatment options'),
  ('services.edit', 'Edit services', 'services', 'Edit service details'),
  ('services.prices.manage', 'Manage service prices', 'services', 'Change prices and price groups'),
  ('inventory.products.manage', 'Manage inventory products', 'inventory', 'Create and edit products'),
  ('inventory.stock.adjust', 'Adjust inventory stock', 'inventory', 'Post stock movements and adjustments'),
  ('inventory.suppliers.manage', 'Manage suppliers', 'inventory', 'Create and edit suppliers'),
  ('inventory.purchase_orders.manage', 'Manage purchase orders', 'inventory', 'Create and receive purchase orders'),
  ('staff.create', 'Create staff', 'staff', 'Create employee records'),
  ('staff.edit', 'Edit staff', 'staff', 'Edit employee records'),
  ('staff.status.manage', 'Manage staff status', 'staff', 'Activate or deactivate employees'),
  ('accounting.chart.manage', 'Manage chart of accounts', 'accounting', 'Create and edit ledger accounts'),
  ('accounting.journal.manage', 'Manage journal entries', 'accounting', 'Create and post journal entries'),
  ('accounting.bank.view', 'View bank transactions', 'accounting', 'View bank ledger and reconciliations'),
  ('accounting.bank.manage', 'Manage bank transactions', 'accounting', 'Post and reconcile bank transactions'),
  ('accounting.statements.view', 'View account statements', 'accounting', 'View ledger and account statements'),
  ('reports.automation.view', 'View automated reports', 'reports', 'Preview scheduled management reports'),
  ('reports.automation.manage', 'Manage automated reports', 'reports', 'Configure and send scheduled management reports')
)
insert into public.hr_permissions (code, name, module)
select code, name, module from permission_seed
on conflict (code) do update set
  name = excluded.name,
  module = excluded.module;

-- Full-access roles automatically receive every new permission. Other roles are
-- intentionally configured per user from Settings > User management.
insert into public.hr_role_permissions (role_id, permission_id)
select r.id, p.id
from public.hr_roles r
cross join public.hr_permissions p
where lower(r.name) in ('admin', 'administrator', 'owner', 'super admin', 'مدير النظام')
  and p.code in (
    'dashboard.appointments.view','dashboard.invoices.view','dashboard.summary.view',
    'customers.contact.view','customers.financial.view','customers.tags.manage',
    'customers.referrals.manage','customers.balance.manage',
    'appointments.status.update','appointments.confirm','appointments.check_in','appointments.assign_staff',
    'payments.invoice.create','payments.split.create','payments.void',
    'services.create','services.edit','services.prices.manage',
    'inventory.products.manage','inventory.stock.adjust','inventory.suppliers.manage','inventory.purchase_orders.manage',
    'staff.create','staff.edit','staff.status.manage',
    'accounting.chart.manage','accounting.journal.manage','accounting.bank.view',
    'accounting.bank.manage','accounting.statements.view',
    'reports.automation.view','reports.automation.manage'
  )
on conflict do nothing;
