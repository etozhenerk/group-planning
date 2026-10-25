import unittest

from ios_links import DOMAINS, invitation_host, profile_application_id, verify_signed_entitlements


class IOSLinks(unittest.TestCase):
    def profile(self):
        return {'TeamIdentifier': ['ABCDEFGHIJ'], 'ApplicationIdentifierPrefix': ['KLMNOPQRST'],
                'Entitlements': {'application-identifier': 'KLMNOPQRST.dev.groupplanning.ios',
                                 DOMAINS: ['*']}}

    def test_app_id_prefix_can_differ_from_team(self):
        self.assertEqual(profile_application_id(self.profile(), 'ABCDEFGHIJ', 'smwhere.ru'),
                         'KLMNOPQRST.dev.groupplanning.ios')

    def test_rejects_wrong_team_bundle_and_prefix(self):
        for profile in [dict(self.profile(), TeamIdentifier=['OTHERTEAM1']),
                        dict(self.profile(), ApplicationIdentifierPrefix=['ABCDEFGHIJ'])]:
            with self.assertRaises(ValueError):
                profile_application_id(profile, 'ABCDEFGHIJ', 'smwhere.ru')
        profile = self.profile()
        profile['Entitlements']['application-identifier'] = 'KLMNOPQRST.dev.groupplanning.ios.tests'
        with self.assertRaises(ValueError):
            profile_application_id(profile, 'ABCDEFGHIJ', 'smwhere.ru')

    def test_missing_or_foreign_capability_fails_before_signing(self):
        for domains in [None, [], ['applinks:other.example'], '*']:
            profile = self.profile()
            profile['Entitlements'][DOMAINS] = domains
            with self.assertRaisesRegex(ValueError, 'Associated Domains'):
                profile_application_id(profile, 'ABCDEFGHIJ', 'smwhere.ru')

    def test_archive_and_export_must_keep_exact_domain(self):
        identifier = 'KLMNOPQRST.dev.groupplanning.ios'
        verify_signed_entitlements({'application-identifier': identifier,
                                    DOMAINS: ['applinks:smwhere.ru']}, identifier, 'smwhere.ru')
        for data in [{'application-identifier': identifier},
                     {'application-identifier': identifier, DOMAINS: ['*']},
                     {'application-identifier': 'ABCDEFGHIJ.dev.groupplanning.ios',
                      DOMAINS: ['applinks:smwhere.ru']}]:
            with self.assertRaises(ValueError):
                verify_signed_entitlements(data, identifier, 'smwhere.ru')

    def test_release_host_is_bound_to_origin(self):
        self.assertEqual(invitation_host('https://smwhere.ru'), 'smwhere.ru')
        for value in ['http://smwhere.ru', 'https://smwhere.ru:8443',
                      'https://user@smwhere.ru', 'https://smwhere.ru/i/',
                      'https://smwhere.ru?x=1', 'https://*.smwhere.ru']:
            with self.assertRaises(ValueError):
                invitation_host(value)
