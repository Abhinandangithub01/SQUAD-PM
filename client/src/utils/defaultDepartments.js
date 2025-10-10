// Default departments and roles to be created for new organizations

export const DEFAULT_DEPARTMENTS = [
  {
    name: 'Engineering',
    code: 'ENG',
    description: 'Software development and technical operations',
    roles: [
      { name: 'Junior Software Engineer', level: 'JUNIOR', description: 'Entry-level developer' },
      { name: 'Software Engineer', level: 'MID', description: 'Mid-level developer' },
      { name: 'Senior Software Engineer', level: 'SENIOR', description: 'Senior developer' },
      { name: 'Tech Lead', level: 'LEAD', description: 'Technical team leader' },
      { name: 'Engineering Manager', level: 'MANAGER', description: 'Manages engineering team' },
      { name: 'Director of Engineering', level: 'DIRECTOR', description: 'Oversees engineering department' },
      { name: 'VP of Engineering', level: 'VP', description: 'Vice President of Engineering' },
      { name: 'CTO', level: 'C_LEVEL', description: 'Chief Technology Officer' },
    ]
  },
  {
    name: 'Product Management',
    code: 'PM',
    description: 'Product strategy and roadmap',
    roles: [
      { name: 'Associate Product Manager', level: 'JUNIOR', description: 'Entry-level PM' },
      { name: 'Product Manager', level: 'MID', description: 'Manages product features' },
      { name: 'Senior Product Manager', level: 'SENIOR', description: 'Senior PM' },
      { name: 'Lead Product Manager', level: 'LEAD', description: 'Leads product initiatives' },
      { name: 'Group Product Manager', level: 'MANAGER', description: 'Manages PM team' },
      { name: 'Director of Product', level: 'DIRECTOR', description: 'Oversees product department' },
      { name: 'VP of Product', level: 'VP', description: 'Vice President of Product' },
      { name: 'CPO', level: 'C_LEVEL', description: 'Chief Product Officer' },
    ]
  },
  {
    name: 'Design',
    code: 'DES',
    description: 'User experience and visual design',
    roles: [
      { name: 'Junior Designer', level: 'JUNIOR', description: 'Entry-level designer' },
      { name: 'UX/UI Designer', level: 'MID', description: 'Mid-level designer' },
      { name: 'Senior Designer', level: 'SENIOR', description: 'Senior designer' },
      { name: 'Lead Designer', level: 'LEAD', description: 'Design team lead' },
      { name: 'Design Manager', level: 'MANAGER', description: 'Manages design team' },
      { name: 'Director of Design', level: 'DIRECTOR', description: 'Oversees design department' },
      { name: 'VP of Design', level: 'VP', description: 'Vice President of Design' },
      { name: 'Chief Design Officer', level: 'C_LEVEL', description: 'Chief Design Officer' },
    ]
  },
  {
    name: 'Marketing',
    code: 'MKT',
    description: 'Marketing and brand management',
    roles: [
      { name: 'Marketing Coordinator', level: 'JUNIOR', description: 'Entry-level marketing' },
      { name: 'Marketing Specialist', level: 'MID', description: 'Marketing specialist' },
      { name: 'Senior Marketing Manager', level: 'SENIOR', description: 'Senior marketing' },
      { name: 'Marketing Lead', level: 'LEAD', description: 'Marketing team lead' },
      { name: 'Marketing Manager', level: 'MANAGER', description: 'Manages marketing team' },
      { name: 'Director of Marketing', level: 'DIRECTOR', description: 'Oversees marketing' },
      { name: 'VP of Marketing', level: 'VP', description: 'Vice President of Marketing' },
      { name: 'CMO', level: 'C_LEVEL', description: 'Chief Marketing Officer' },
    ]
  },
  {
    name: 'Sales',
    code: 'SALES',
    description: 'Sales and business development',
    roles: [
      { name: 'Sales Development Representative', level: 'JUNIOR', description: 'Entry-level sales' },
      { name: 'Account Executive', level: 'MID', description: 'Mid-level sales' },
      { name: 'Senior Account Executive', level: 'SENIOR', description: 'Senior sales' },
      { name: 'Sales Team Lead', level: 'LEAD', description: 'Sales team lead' },
      { name: 'Sales Manager', level: 'MANAGER', description: 'Manages sales team' },
      { name: 'Director of Sales', level: 'DIRECTOR', description: 'Oversees sales department' },
      { name: 'VP of Sales', level: 'VP', description: 'Vice President of Sales' },
      { name: 'Chief Revenue Officer', level: 'C_LEVEL', description: 'Chief Revenue Officer' },
    ]
  },
  {
    name: 'Customer Success',
    code: 'CS',
    description: 'Customer support and success',
    roles: [
      { name: 'Customer Support Specialist', level: 'JUNIOR', description: 'Entry-level support' },
      { name: 'Customer Success Manager', level: 'MID', description: 'Customer success' },
      { name: 'Senior CSM', level: 'SENIOR', description: 'Senior customer success' },
      { name: 'CS Team Lead', level: 'LEAD', description: 'CS team lead' },
      { name: 'CS Manager', level: 'MANAGER', description: 'Manages CS team' },
      { name: 'Director of Customer Success', level: 'DIRECTOR', description: 'Oversees CS' },
      { name: 'VP of Customer Success', level: 'VP', description: 'Vice President of CS' },
      { name: 'Chief Customer Officer', level: 'C_LEVEL', description: 'Chief Customer Officer' },
    ]
  },
  {
    name: 'Human Resources',
    code: 'HR',
    description: 'People operations and talent management',
    roles: [
      { name: 'HR Coordinator', level: 'JUNIOR', description: 'Entry-level HR' },
      { name: 'HR Specialist', level: 'MID', description: 'HR specialist' },
      { name: 'Senior HR Manager', level: 'SENIOR', description: 'Senior HR' },
      { name: 'HR Team Lead', level: 'LEAD', description: 'HR team lead' },
      { name: 'HR Manager', level: 'MANAGER', description: 'Manages HR team' },
      { name: 'Director of HR', level: 'DIRECTOR', description: 'Oversees HR department' },
      { name: 'VP of People', level: 'VP', description: 'Vice President of People' },
      { name: 'CHRO', level: 'C_LEVEL', description: 'Chief Human Resources Officer' },
    ]
  },
  {
    name: 'Finance',
    code: 'FIN',
    description: 'Financial planning and accounting',
    roles: [
      { name: 'Junior Accountant', level: 'JUNIOR', description: 'Entry-level finance' },
      { name: 'Accountant', level: 'MID', description: 'Mid-level accountant' },
      { name: 'Senior Accountant', level: 'SENIOR', description: 'Senior accountant' },
      { name: 'Finance Lead', level: 'LEAD', description: 'Finance team lead' },
      { name: 'Finance Manager', level: 'MANAGER', description: 'Manages finance team' },
      { name: 'Director of Finance', level: 'DIRECTOR', description: 'Oversees finance' },
      { name: 'VP of Finance', level: 'VP', description: 'Vice President of Finance' },
      { name: 'CFO', level: 'C_LEVEL', description: 'Chief Financial Officer' },
    ]
  },
  {
    name: 'Operations',
    code: 'OPS',
    description: 'Business operations and processes',
    roles: [
      { name: 'Operations Coordinator', level: 'JUNIOR', description: 'Entry-level ops' },
      { name: 'Operations Specialist', level: 'MID', description: 'Operations specialist' },
      { name: 'Senior Operations Manager', level: 'SENIOR', description: 'Senior operations' },
      { name: 'Operations Lead', level: 'LEAD', description: 'Operations team lead' },
      { name: 'Operations Manager', level: 'MANAGER', description: 'Manages operations team' },
      { name: 'Director of Operations', level: 'DIRECTOR', description: 'Oversees operations' },
      { name: 'VP of Operations', level: 'VP', description: 'Vice President of Operations' },
      { name: 'COO', level: 'C_LEVEL', description: 'Chief Operating Officer' },
    ]
  },
  {
    name: 'Legal',
    code: 'LEGAL',
    description: 'Legal and compliance',
    roles: [
      { name: 'Legal Assistant', level: 'JUNIOR', description: 'Entry-level legal' },
      { name: 'Legal Counsel', level: 'MID', description: 'Legal counsel' },
      { name: 'Senior Legal Counsel', level: 'SENIOR', description: 'Senior legal counsel' },
      { name: 'Lead Counsel', level: 'LEAD', description: 'Lead legal counsel' },
      { name: 'Legal Manager', level: 'MANAGER', description: 'Manages legal team' },
      { name: 'Director of Legal', level: 'DIRECTOR', description: 'Oversees legal department' },
      { name: 'VP of Legal', level: 'VP', description: 'Vice President of Legal' },
      { name: 'General Counsel', level: 'C_LEVEL', description: 'Chief Legal Officer' },
    ]
  },
];

export const createDefaultDepartments = async (client, organizationId) => {
  const createdDepartments = [];
  
  try {
    for (const dept of DEFAULT_DEPARTMENTS) {
      // Create department
      const { data: department } = await client.models.Department.create({
        organizationId,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        isActive: true,
      });

      if (department) {
        // Create roles for this department
        for (const role of dept.roles) {
          await client.models.DepartmentRole.create({
            departmentId: department.id,
            name: role.name,
            description: role.description,
            level: role.level,
            isActive: true,
          });
        }

        createdDepartments.push(department);
      }
    }

    return {
      success: true,
      departments: createdDepartments,
    };
  } catch (error) {
    console.error('Error creating default departments:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
