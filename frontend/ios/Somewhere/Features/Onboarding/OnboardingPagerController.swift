import SwiftUI
import UIKit

@MainActor
final class OnboardingPagerController: UIViewController, UIScrollViewDelegate {
    var settled: ((OnboardingSlide) -> Void)?
    var moving: ((Bool) -> Void)?
    var reduceMotion = false
    var interactionEnabled = true { didSet { scroll.isScrollEnabled = interactionEnabled } }
    private var animator: UIViewPropertyAnimator?
    private let scroll = UIScrollView()
    private var pages: [UIViewController] = []
    private var lastRequest: OnboardingSlide?
    private var visible: OnboardingSlide = .invitation
    private var target: OnboardingSlide?
    private var previousWidth: CGFloat = 0

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .clear
        scroll.translatesAutoresizingMaskIntoConstraints = false
        scroll.isPagingEnabled = true
        scroll.isDirectionalLockEnabled = true
        scroll.bounces = false
        scroll.showsHorizontalScrollIndicator = false
        scroll.contentInsetAdjustmentBehavior = .never
        scroll.accessibilityIdentifier = "onboarding-pages"
        scroll.delegate = self
        view.addSubview(scroll)
        let row = UIStackView()
        row.axis = .horizontal
        row.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(row)
        NSLayoutConstraint.activate([
            scroll.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scroll.topAnchor.constraint(equalTo: view.topAnchor),
            scroll.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            row.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor),
            row.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor),
            row.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor),
            row.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor),
            row.heightAnchor.constraint(equalTo: scroll.frameLayoutGuide.heightAnchor),
        ])
        for slide in OnboardingSlide.allCases {
            let page = UIHostingController(rootView: OnboardingPageView(slide: slide))
            page.view.backgroundColor = .clear
            page.view.accessibilityElementsHidden = slide != visible
            addChild(page)
            row.addArrangedSubview(page.view)
            page.view.widthAnchor.constraint(equalTo: scroll.frameLayoutGuide.widthAnchor)
                .isActive = true
            page.didMove(toParent: self)
            pages.append(page)
        }
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        let width = scroll.bounds.width
        guard width > 0 else { return }
        if width != previousWidth {
            previousWidth = width
            scroll.setContentOffset(
                CGPoint(x: CGFloat((target ?? visible).rawValue) * width, y: 0), animated: false)
        }
        updateEffects()
    }

    func request(_ slide: OnboardingSlide) {
        guard lastRequest != slide else { return }
        lastRequest = slide
        loadViewIfNeeded()
        let width = scroll.bounds.width
        guard width > 0 else {
            visible = slide
            return
        }
        let offset = CGPoint(x: CGFloat(slide.rawValue) * width, y: 0)
        guard abs(scroll.contentOffset.x - offset.x) > 0.5 else { return }
        target = slide
        // SwiftUI must not publish state from inside updateUIViewController.
        Task { @MainActor [weak self] in
            guard let self, target == slide else { return }
            moving?(true)
            let animated = !reduceMotion && view.window != nil
            animate(to: offset, animated: animated)
        }
    }

    private func animate(to offset: CGPoint, animated: Bool) {
        animator?.stopAnimation(true)
        if animated {
            let next = UIViewPropertyAnimator(
                duration: DesignTokens.motionDurationNavigation, curve: .easeOut
            ) {
                self.scroll.contentOffset = offset
            }
            next.addCompletion { [weak self, weak next] position in
                guard let self, let next, self.animator === next, position == .end else { return }
                self.finish()
            }
            animator = next
            next.startAnimation()
        } else {
            scroll.setContentOffset(offset, animated: false)
            finish()
        }
    }

    func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
        animator?.stopAnimation(true)
        target = nil
        moving?(true)
    }

    func scrollViewDidScroll(_ scrollView: UIScrollView) { updateEffects() }
    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) { finish() }
    func scrollViewDidEndScrollingAnimation(_ scrollView: UIScrollView) { finish() }
    func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
        if !decelerate { finish() }
    }

    private func finish() {
        guard scroll.bounds.width > 0 else { return }
        let index = Int((scroll.contentOffset.x / scroll.bounds.width).rounded())
        guard let slide = OnboardingSlide(rawValue: index) else { return }
        target = nil
        visible = slide
        lastRequest = slide
        for (index, page) in pages.enumerated() {
            page.view.accessibilityElementsHidden = index != slide.rawValue
        }
        settled?(slide)
        moving?(false)
    }

    private func updateEffects() {
        guard scroll.bounds.width > 0 else { return }
        let progress = scroll.contentOffset.x / scroll.bounds.width
        for (index, page) in pages.enumerated() {
            let distance = reduceMotion ? 0 : min(1, abs(CGFloat(index) - progress))
            page.view.alpha = 1 - distance * 0.25
            page.view.transform = .identity
        }
    }
}
