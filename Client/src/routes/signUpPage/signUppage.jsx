import './signUppage.css'
import { SignUp } from '@clerk/clerk-react';

const Signuppage = ()=>{
    return (
        <div className='signuppage'>
            <SignUp path="/sign-up" signInUrl='/sign-in'/>
        </div>
    )
}


export default Signuppage;