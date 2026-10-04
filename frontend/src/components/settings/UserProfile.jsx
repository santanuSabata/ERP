import { useState } from 'react';
import { AlertTriangle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const UserProfile = () => {
    const [form, setForm] = useState({
        name: 'Raj S',
        phone: '7815057500',
        email: 'rajobrey@gmail.com',
    });

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        toast.success('User profile updated successfully!');
    };

    const handleVerifyEmail = () => {
        toast.success('Verification link sent to your email!');
    };

    const handleGoogleConnect = () => {
        toast.success('Google account connected successfully!');
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-2xs">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-8">
                User Profile
            </h1>

            <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
                {/* Profile Image */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">Profile Image :</label>
                    <div className="md:col-span-2 flex items-center gap-4">
                        <div className="h-20 w-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner flex items-center justify-center">
                            <img
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-2xs"
                        >
                            <Upload size={14} className="text-slate-500" />
                            Upload Image
                        </button>
                    </div>
                </div>

                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">
                        <span className="text-rose-500 mr-1">*</span>Name :
                    </label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition"
                        />
                    </div>
                </div>

                {/* Phone Number */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <label className="text-xs font-semibold text-slate-600">Phone Number :</label>
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition"
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-start gap-4">
                    <label className="text-xs font-semibold text-slate-600 pt-3">Email :</label>
                    <div className="md:col-span-2 space-y-2.5">
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-hidden transition"
                        />
                        
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                            <span>
                                Please{' '}
                                <button
                                    type="button"
                                    onClick={handleVerifyEmail}
                                    className="text-blue-600 font-semibold underline hover:text-blue-700 cursor-pointer"
                                >
                                    Click here
                                </button>{' '}
                                to verify your email
                            </span>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={handleGoogleConnect}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition shadow-2xs"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                                Connect with Google
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save & Update Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-md shadow-blue-500/20"
                    >
                        Save & Update
                    </button>
                </div>
            </form>

            <hr className="border-slate-100 my-8" />

            {/* Request Something Section */}
            <div className="space-y-3 max-w-xl">
                <h3 className="text-sm font-bold text-slate-900">Request Something?</h3>
                <div className="text-xs space-y-2 text-slate-600">
                    <p>
                        Want to Change mobile number?{' '}
                        <button onClick={() => toast('Request submitted')} className="text-blue-600 font-semibold hover:underline">
                            Click here
                        </button>
                    </p>
                    <p>
                        Manage login sessions?{' '}
                        <button onClick={() => toast('Redirecting to sessions')} className="text-blue-600 font-semibold hover:underline">
                            Click here
                        </button>
                    </p>
                </div>

                {/* Danger Zone */}
                <div className="pt-4 space-y-2">
                    <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider">Danger Zone</h4>
                    <div className="text-xs space-y-2 text-slate-600">
                        <p>
                            Want to Reset Your Account Data?{' '}
                            <button onClick={() => toast.error('Reset requested')} className="text-blue-600 font-semibold hover:underline">
                                Click here
                            </button>
                        </p>
                        <p>
                            Want to Delete Your Account Permanently?{' '}
                            <button onClick={() => toast.error('Deletion requested')} className="text-rose-600 font-semibold hover:underline">
                                Click here
                            </button>
                        </p>
                        <p className="text-[11px] text-slate-400">
                            Your request will be processed within 5-7 business days.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;