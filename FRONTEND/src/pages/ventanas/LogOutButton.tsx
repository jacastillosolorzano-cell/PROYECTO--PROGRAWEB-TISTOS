import { Button } from "@/components/ui/button";
import { LogOut, Settings, User } from "lucide-react";
import { useState } from "react";
import { Dialog,DialogContent,DialogHeader,DialogFooter } from "@/components/ui/dialog";
import Profile from "../Profile";
import { useNavigate } from "react-router-dom";


export default function MenuLogOut()
{
    const [openLogOut, setOpenLogOut] = useState(false);
    const navigate = useNavigate();

    const gestionLogOut = () =>
    {
        console.log("Sesion Cerrada")
        localStorage.clear();
        navigate("/login");

        setOpenLogOut(false)
    }




    return(
        <div className="flex flex-col">
            <Button
            variant="ghost"
            className="justify-start w-full px-6 py-4 text-left"
            onClick={()=>
                {
                    setOpenLogOut(true);
                                       
                }}
            >
                <LogOut className="w-5 h-5 mr-2"/> Cerrar Sesion
            </Button>
            
            <Dialog open={openLogOut} onOpenChange={setOpenLogOut}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <p className="text-sm text-gray-500">
                            Estas a punto de Cerrar Sesion
                        </p>
                        <DialogFooter className="mt-4 flex justify-end space-x-2">
                            <Button variant="outline" onClick={()=>setOpenLogOut(false)}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={gestionLogOut}>
                                Si, cerrar sesion
                            </Button>
                        </DialogFooter>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    )
}
