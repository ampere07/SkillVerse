export const formatFullName = (
  firstName: string,
  middleInitial: string | undefined | null,
  lastName: string
): string => {
  if (!firstName || !lastName) {
    return 'Unknown User';
  }

  const middle = middleInitial && middleInitial.trim() 
    ? ` ${middleInitial.trim()}.` 
    : '';

  return `${firstName}${middle} ${lastName}`;
};

export const formatUserName = (user: any): string => {
  if (!user) return 'Unknown User';
  
  if (user.firstName && user.lastName) {
    return formatFullName(user.firstName, user.middleInitial, user.lastName);
  }
  
  if (user.name) {
    return user.name;
  }
  
  return 'Unknown User';
};
