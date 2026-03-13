export const bookGenres = ["Fiction", "Non-Fiction", "Mystery", "Sci-Fi", "Romance"];

export const getDaysLeft = (dueDate: string): number | "Overdue" => {
  const today = new Date();
  const due = new Date(dueDate);
  
  // Calculate the difference in days
  const differenceInTime = due.getTime() - today.getTime();
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
  
  return differenceInDays < 0 ? "Overdue" : differenceInDays;
};

export const getGoogleBooksMockImages = (query: string) => {
  return [
    "https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=200",
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200",
    "https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=200",
  ];
};
