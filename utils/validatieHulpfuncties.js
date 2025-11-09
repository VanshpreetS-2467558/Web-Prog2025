import bcrypt from "bcrypt";


// checkt of email valid is
export function isValidEmail(email){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// checkt of nummer valid is
export function isValidPhone(phone){
    return /^\+?\d{8,15}$/.test(phone);
}

// checkt of wachtwoord sterk genoeg is
export function isStrongPassword(password){
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);
}

// checked of wachtwoord correct is
export async function isPasswordCorrect(password, hash){
    return await bcrypt.compare(password, hash);
}



