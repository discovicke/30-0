import { useState } from 'react';
import Navigation from './components/Navigation/Navigation';
import Layout from './components/Layout/Layout';
import DraftSim from './components/DraftSim/DraftSim';
import BatchSim from './components/BatchSim/BatchSim';
import DreamTeam from './components/DreamTeam/DreamTeam';
import styles from './App.module.scss';

const tabs = [
  { id: 'draft', component: DraftSim },
  { id: 'batch', component: BatchSim },
  { id: 'simulate', component: DreamTeam },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('draft');

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component ?? DraftSim;

  return (
    <div className={styles.app}>
      <Navigation active={activeTab} onChange={setActiveTab} />
      <Layout>
        <ActiveComponent />
      </Layout>
    </div>
  );
}
