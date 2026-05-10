import { useState, useRef, FormEvent } from 'react';
import type { Person } from 'shared';
import type { CreatePersonInput } from 'shared';
import { personsApi } from '../../api/persons';
import { mediaBase } from '../../api/mediaUrl';
import Button from '../UI/Button';
import toast from 'react-hot-toast';

interface Props {
  initial?: Partial<Person>;
  onSubmit: (data: CreatePersonInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function PersonForm({ initial, onSubmit, onCancel, submitLabel = 'Save' }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? '');
  const [deathDate, setDeathDate] = useState(initial?.deathDate ?? '');
  const [gender, setGender] = useState<'male' | 'female' | 'unknown'>(initial?.gender ?? 'unknown');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { photoUrl: url } = await personsApi.uploadPhoto(file);
      setPhotoUrl(url);
      toast.success('Photo uploaded');
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) { toast.error('First and last name are required'); return; }
    setSaving(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate || null,
        deathDate: deathDate || null,
        gender,
        bio: bio.trim() || null,
        photoUrl: photoUrl || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">First name *</label>
          <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Jane" />
        </div>
        <div>
          <label className="label">Last name *</label>
          <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Smith" />
        </div>
      </div>
      <div>
        <label className="label">Gender</label>
        <select className="input" value={gender} onChange={e => setGender(e.target.value as typeof gender)}>
          <option value="unknown">Unknown</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Birth date</label>
          <input className="input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Death date</label>
          <input className="input" type="date" value={deathDate} onChange={e => setDeathDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Bio</label>
        <textarea className="input" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="A few words about this person…" />
      </div>
      <div>
        <label className="label">Photo</label>
        <div className="flex items-center gap-3">
          {photoUrl && <img src={`${mediaBase}${photoUrl}`} alt="" className="w-10 h-10 rounded-full object-cover" />}
          <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? 'Uploading…' : 'Upload photo'}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : submitLabel}</Button>
      </div>
    </form>
  );
}
