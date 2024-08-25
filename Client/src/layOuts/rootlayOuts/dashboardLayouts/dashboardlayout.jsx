import { Outlet , useNavigate} from 'react-router-dom';
import { useEffect } from 'react';
import './dashboardlayout.css'
import Chatlist from '../../../components1/ChatList/ChatList';




import { useAuth } from '@clerk/clerk-react';

const Dashboardlayout = ()=>{
    const {userId, isLoaded } = useAuth();

    const navigate = useNavigate();
    useEffect(()=>{
        if(isLoaded && !userId){
            navigate("/sign-in");
        }
    }, [isLoaded, userId, navigate]);

    if (!isLoaded) return "Loading...";




    return (
        <div className='dashboardlayout'>
            <div className='menu'><Chatlist /></div>
            <div className='content'>
                <Outlet />
            </div>
        </div>
    );
};

export default Dashboardlayout;