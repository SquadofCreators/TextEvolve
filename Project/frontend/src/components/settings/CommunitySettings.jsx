// src/components/settings/CommunitySettings.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { sectionVariants } from '../../utils/styleConstants'; // Adjust path

function CommunitySettingsContent() {
    return (
        <motion.section key="community" variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
            {/* Using a Callout style structure */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-600 p-4 rounded-r-lg">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">Coming Soon!</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    Community features are under development. Soon you'll be able to manage your public profile, document sharing preferences, and collaboration settings right here.
                </p>
            </div>
            {/* Optionally add disabled form fields as placeholders */}
            {/* <form className="mt-6 space-y-4 opacity-50 pointer-events-none"> ... </form> */}
        </motion.section>
    );
}
export default CommunitySettingsContent;