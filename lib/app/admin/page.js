'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState('suggestions');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeSug = onSnapshot(collection(db, "suggestions"), (snapshot) => {
      setSuggestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
      unsubscribeSug();
    };
  }, []);

  const toggleMemberStatus = async (memberId, currentStatus) => {
    const newStatus = currentStatus === 'actif' ? 'en_attente' : 'actif';
    await updateDoc(doc(db, "users", memberId), { status: newStatus });
  };

  const deleteMember = async (memberId) => {
    if (confirm("Voulez-vous vraiment retirer ce membre de l'équipe ?")) {
      await deleteDoc(doc(db, "users", memberId));
    }
  };

  const toggleSuggestionStatus = async (sugId, currentStatus) => {
    await updateDoc(doc(db, "suggestions", sugId), { 
      status: currentStatus === 'traite' ? 'nouveau' : 'traite' 
    });
  };

  if (!user) {
    return <div className="p-8 text-center">Accès restreint. Veuillez vous connecter.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Tableau de Bord Administration</h1>

      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4">
        <button 
          onClick={() => setActiveTab('suggestions')}
          className={`pb-2 px-4 font-semibold ${activeTab === 'suggestions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Suggestions ({suggestions.length})
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={`pb-2 px-4 font-semibold ${activeTab === 'members' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          Gestion de l'Équipe ({members.length})
        </button>
      </div>

      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          {suggestions.map((sug) => (
            <div key={sug.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex justify-between items-start">
              <div>
                <div className="font-bold">{sug.firstname} {sug.lastname} <span className="text-xs text-gray-400 font-normal">({sug.email} | {sug.phone})</span></div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{sug.message}</p>
              </div>
              <button 
                onClick={() => toggleSuggestionStatus(sug.id, sug.status)}
                className={`text-xs px-3 py-1 rounded font-semibold ${sug.status === 'traite' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
              >
                {sug.status === 'traite' ? 'Traité ✅' : 'Marquer comme traité'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700 text-xs font-semibold uppercase">
              <tr>
                <th className="p-3">Utilisateur</th>
                <th className="p-3">Rôle</th>
                <th className="p-3">Statut Compte</th>
                <th className="p-3">Actions Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="p-3 font-medium">{member.email}</td>
                  <td className="p-3">{member.role || 'Rédacteur'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${member.status === 'actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {member.status || 'actif'}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <button 
                      onClick={() => toggleMemberStatus(member.id, member.status)}
                      className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 px-2 py-1 rounded"
                    >
                      {member.status === 'actif' ? 'Désactiver' : 'Valider l\'accès'}
                    </button>
                    <button 
                      onClick={() => deleteMember(member.id)}
                      className="text-xs bg-red-100 text-red-800 hover:bg-red-200 px-2 py-1 rounded"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
