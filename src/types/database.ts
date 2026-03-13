export interface OrganizationStructure {
  level3: {
    libraries: string[];
    level3_role_names: string[];
  };
  level4: {
    configs: {
      id: string;
      name: string;
      max_books: number;
      fine_per_day: number;
      loan_duration: number;
      reservation_duration: number;
    }[];
  };
  resource_types: string[];
}

export interface Institution {
  id: string;
  name: string;
  organization_structure: OrganizationStructure;
}

export interface Libraries {
  id: string;
  name: string;
  address: string;
  institution_id: string;
  contact_number: string;
  open_time: string;
  close_time: string;
  days_closed: string[];
  resources: string[];
  shelves: {
    id: string;
    description: string;
  }[];
  managed_by: string[];
  user_types: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LibrariesInsert {
  name: string;
  address: string;
  institution_id: string;
  contact_number: string;
  open_time: string;
  close_time: string;
  days_closed: string[];
  resources: string[];
  shelves: {
    id: string;
    description: string;
  }[];
  managed_by: string[];
  user_types: string[];
  created_by: string;
}

export interface LibrariesUpdate {
  name: string;
  address: string;
  institution_id: string;
  contact_number: string;
  open_time: string;
  close_time: string;
  days_closed: string[];
  resources: string[];
  shelves: {
    id: string;
    description: string;
  }[];
  managed_by: string[];
  user_types: string[];
  updated_at: string;
} 