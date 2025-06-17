export function getCookie(document: Document, name: string): string | null {
  const cookieArray = document.cookie.split('; ');
  for (const cookie of cookieArray) {
    const [key, value] = cookie.split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null; // Return null if the cookie is not found
}

export function setCookie(
  document: Document, 
  name: string, 
  value: string | null, 
  days: number = 7, 
  path: string = '/'
): void {
  if (value === null) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; secure; samesite=strict`;
    return;
  }
  
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  
  // Set secure cookie options
  const secureOptions = '; secure; samesite=strict';
  
  document.cookie = `${name}=${encodeURIComponent(value as string)}${expires}; path=${path}${secureOptions}`;
}
