package identity

// saveProfile preserves fields omitted because the current provider token lacks
// a permission. A present empty value is distinct from an omitted field.
func (s *Service) saveProfile(records Records, profile Profile) (User, error) {
	subject := "yandex:" + profile.Subject
	user, exists := records.UserBySubject(subject)
	if !exists {
		user = User{ID: uuid(), CreatedAt: s.now()}
	}

	user.DisplayName = profile.DisplayName
	if profile.AvatarURL != nil {
		user.AvatarURL = *profile.AvatarURL
	}

	if profile.Email != nil {
		user.Email = *profile.Email
	}

	if profile.Phone != nil {
		user.Phone = *profile.Phone
	}

	for target, source := range map[*string]*string{
		&user.Login:     profile.Login,
		&user.FirstName: profile.FirstName,
		&user.LastName:  profile.LastName,
		&user.Birthday:  profile.Birthday,
		&user.Sex:       profile.Sex,
	} {
		if source != nil {
			*target = *source
		}
	}

	return user, records.PutUser(subject, user)
}
