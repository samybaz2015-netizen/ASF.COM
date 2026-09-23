import React from 'react';
import { Dialog, DialogContent, DialogActions, Button } from '@mui/material';

const LogoutDialog = ({ open, onClose, onConfirm }) => {
    
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            PaperProps={{
                className: 'dialog-paper'
            }}
        >
            <DialogContent style={{ padding: '16px', direction: "rtl" }}>
                <p>هل أنت متأكد أنك تريد تسجيل الخروج؟</p>
            </DialogContent>
            <DialogActions className="dialog-actions">
                <Button onClick={onClose} className="cancel-button">
                    إلغاء
                </Button>
                <Button onClick={onConfirm} className="save-button">
                    نعم 
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LogoutDialog;
